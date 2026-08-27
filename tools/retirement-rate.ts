// THE RETIREMENT BENCH - `npm run bench:retire`. Same shape as the knock / econ / fatigue benches: a
// measurement harness, run by hand, never part of a gate.
//
// THE QUESTION IT EXISTS TO ANSWER, and it is a calibration rather than a curiosity. The research
// (docs/research/retirement-and-withdrawal.md §7) anchors the rate at **2.73% of matches** on the
// women's ITF World Tennis Tour - 7,291 of ~266,900, PLOS ONE June 2024 - counting a match as
// retired if EITHER player stopped. `RETIRE_K` in engine/match/point.ts is the one number that moves
// it, and this file is where it is measured rather than guessed (CLAUDE.md invariant 4).
//
// ⚠ IT MEASURES THE MATCHES THE GAME ACTUALLY PLAYS, not a synthetic population, and that is the
// point. The hazard reads in-match fatigue, so the rate is a consequence of how long her matches run
// - which is a consequence of her draws, her opponents, her stamina and the tier she is on. A bench
// over hand-built players would calibrate against a distribution the game does not have.
//
// It also prints the per-tier breakdown, because the design claim under `retireHazard` is that
// TIER-DEPENDENCE ARRIVES FOR FREE: nothing in the hazard reads the tier, so any spread across the
// ladder here is the draws playing longer, and is the evidence for that claim.
//
// =================================================================================================
// ⚠⚠ RE-AIMED 27.08, AND THE RE-AIM IS THE REASON THE 27.08 FIX COULD BE GRADED AT ALL
// =================================================================================================
//
// WHAT WAS WRONG WITH IT. Every entry was gated on
//
//     if (world.condition >= ECONOMY.condition.matchStrengthKnee) {
//
// - the policy would not let her enter a tournament below condition 70. `conditionMatchFactor`
// returns exactly 1 above that same 70, so EVERY MATCH IN THIS BENCH'S CORPUS SAT IN THE FLAT PART
// OF THE CURVE. The number `RETIRE_K = 0.07` was calibrated against a population that never once
// arrives worn out, on a game whose players spend most of a busy season below 60
// (docs/specs/retirement-shape-2026-08.md §6: 7,893 of her 13,529 measured matches). Three
// consequences, all of which bite before a fix is even written:
//
//   * a change that raises SUB-KNEE risk moves this bench not at all - a null result produced by an
//     arm that does not contain the thing being measured, which is exactly CLAUDE.md's null-arm
//     hazard;
//   * a change that lowers ABOVE-KNEE risk drops this bench below the anchor and reads as a
//     regression, when it is the intended half of a redistribution;
//   * and the headline it printed was therefore an ABOVE-THE-KNEE number wearing a population
//     number's clothes.
//
// WHAT THE RE-AIM IS. Three arms over the same policy, spanning the arrival range a career actually
// sees - and the shipped gate is KEPT AS ONE OF THEM, unchanged, so the historical number is still
// reproduced on the population it was always measured over. Nothing is weakened; two arms are added
// beside it and the grading moves to the pooled corpus.
//
//     knee     the SHIPPED policy, gate intact - `world.condition >= matchStrengthKnee`. The
//              continuity arm. Its headline must not move when the model's shape does not.
//     all      the same appetite with the gate removed: she enters whatever she arrives at and only
//              the engine's own medical floor stops her. This is «УЖЕ в низкой кондиции… ПОСТОЯННО».
//     rested   she enters only at 85 or better and never two weeks running. This is «приезжаю с
//              80-90 на турнир», and it is the arm the fix is FOR.
//
// AND IT NOW REPORTS THE THREE THINGS THE OLD HEADLINE HID:
//
//   1. THE RATE BY ARRIVAL CONDITION, which is the axis the fix moves and the axis the old bench
//      could not see;
//   2. THE PER-SIDE CONDITION CENSUS, hazard-weighted - the population `retireDurability`'s pivot is
//      centred on, printed so the constant can be checked against the corpus rather than trusted;
//   3. THE MEAN MULTIPLIER ACHIEVED, `Σ h·d / Σ h` over every side of every match. That number is
//      the whole safety of the fix: at 1.000 the expected number of retirements is unchanged and
//      only WHO stops has moved, so the 2.73% anchor survives by construction.
//
// ⚠ WHY HAZARD-WEIGHTED AND NOT MATCH-WEIGHTED, because it is the trap this bench is built to avoid.
// The expected number of retirements is `Σ over sides of min(1, h·d)`, so the weight a side deserves
// is the hazard it actually carries, not one vote per player. Worn players play LONGER matches (153
// points against 147, retirement-shape-2026-08.md §3.3) and therefore carry more hazard per match
// than their head-count earns. Centre on the plain mean and the heavy end of the curve is
// over-weighted in the only sum that matters, and the rate quietly rises.
//
// ⚠ AND THE READ IS CHECKED, NOT ASSERTED - two instrument arms, printed above every result:
//   (a) EVERY kid match is RE-SIMULATED at its stored seed off the frozen `pendingTournament.players`
//       and must reproduce the winner and the scoreline. Since 27.08 that is a STRONGER check than it
//       was: the freshness the hazard integrates rides on `MatchPlayer.condition`, so a re-simulation
//       that reproduces a RETIREMENT reproduces the freshness too. It is also what makes `totalPoints`
//       - and so every hazard weight below - the engine's own number rather than this file's guess.
//   (b) THE FRESHNESS THIS FILE WEIGHS BY IS THE ENGINE'S OWN, taken off the frozen snapshot rather
//       than re-derived: `players[KID_ID].condition` must equal the `world.condition` read at the
//       same point, which is an identity of the composition (world/player.ts writes one from the
//       other) and therefore a test of THIS FILE'S READ ORDER. If the body were read after finalize,
//       the two would part company and every arrival number below would be off by one week's strain.
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  KID_ID,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import {
  RETIRE_K,
  RETIRE_DURABILITY_PIVOT,
  RETIRE_DURABILITY_SPAN,
  retireDurability,
  spentness,
} from '../src/engine/match/point'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import type { TierId } from '../src/engine/season/types'

const CAREERS = Number(process.env.CAREERS ?? 12)
const WEEKS = Number(process.env.WEEKS ?? 52 * 6)
const REST_GATE = Number(process.env.REST_GATE ?? 85)

/** ⭐ THE THREE ARMS. `knee` is the SHIPPED policy, byte for byte - it is the continuity arm and it
 *  must never be quietly re-aimed into something else. */
type ArmId = 'knee' | 'all' | 'rested'
const ARMS: ArmId[] = (process.env.ARMS ?? 'knee,all,rested').split(',') as ArmId[]

/** One side of one kid match: what it arrived at, and how much hazard it carried. */
interface SideRow {
  /** true for the kid, false for whoever was across the net */
  hers: boolean
  condition: number
  /** Σ spentness over the match at this side's stamina, i.e. the hazard BEFORE `RETIRE_K` and
   *  before the freshness multiplier - the weight this side deserves in the census. */
  hazard: number
  retired: boolean
}

interface ArmOut {
  matches: number
  retirements: number
  kidRetirements: number
  oppRetirements: number
  games: number
  points: number
  /** her arrival, one row per HER match */
  arrivals: { condition: number; retired: boolean; points: number }[]
  sides: SideRow[]
  byTier: Map<TierId, { m: number; r: number }>
  resimMismatch: number
  /** instrument (b): frozen kid snapshots checked against the arrival this file read */
  arrivalChecked: number
  arrivalMismatch: number
  /** a side that stepped on court with no composed condition at all - never observed on this path */
  freshnessAbsent: number
}

function emptyArm(): ArmOut {
  return {
    matches: 0,
    retirements: 0,
    kidRetirements: 0,
    oppRetirements: 0,
    games: 0,
    points: 0,
    arrivals: [],
    sides: [],
    byTier: new Map(),
    resimMismatch: 0,
    arrivalChecked: 0,
    arrivalMismatch: 0,
    freshnessAbsent: 0,
  }
}

/** Σ `spentness` over a match of `points` points at `stamina` - the hazard weight, with `RETIRE_K`
 *  and the freshness multiplier deliberately factored OUT so the census weights are a property of
 *  the match rather than of the constant being graded. */
function hazardOver(points: number, stamina: number): number {
  let h = 0
  for (let n = 1; n <= points; n++) h += spentness(n, stamina)
  return h
}

function walk(arm: ArmId, careerIndex: number, out: ArmOut): void {
  const world = createWorld(`retire-${careerIndex}`)
  const rng = rngFromSeed(world.seed)
  const strongestFirst = [...TIER_LADDER].reverse()
  let lastPlayWeek = -2
  for (let i = 0; i < WEEKS; i++) {
    world.fundsCents = Math.max(world.fundsCents, 1_000_000_00) // money never decides an entry here
    // ⚠ THE `knee` ARM IS THE SHIPPED GATE AND IT IS UNCHANGED. The other two are the re-aim: `all`
    // removes the gate so the corpus reaches below it at last, `rested` tightens it so the corpus
    // reaches the top of the range the owner plays at.
    const mayEnter =
      arm === 'knee'
        ? world.condition >= ECONOMY.condition.matchStrengthKnee
        : arm === 'rested'
          ? world.condition >= REST_GATE && world.week >= lastPlayWeek + 2
          : true
    if (mayEnter) {
      for (const tier of strongestFirst) {
        const e = world.season.find(
          (x) =>
            x.tier === tier &&
            x.deadlineWeek >= world.week &&
            x.deadlineWeek - world.week <= 2 &&
            !world.entries.includes(x.id) &&
            !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
        )
        if (!e) continue
        try {
          enterEvent(world, e.id)
          lastPlayWeek = e.week
          break
        } catch {
          /* a gate said no - the policy tries the next rung down */
        }
      }
    }
    tickWeek(world, rng)
    const pending = world.pendingTournament
    if (pending) {
      const event = world.season.find((e) => e.id === pending.eventId)
      const tier = event?.tier
      // ⚠⚠ READ HERE, BEFORE `skipTournament`. The run has been SIMULATED and NOT yet finalized, so
      // `world.condition` is still the value every match of it was played at - the ordering hazard
      // round 26 #14b was made of, and instrument (b) below is what proves this file is on the right
      // side of it.
      const arrival = world.condition
      for (const m of pending.result.matches) {
        if (m.aId !== KID_ID && m.bId !== KID_ID) continue
        const a = pending.players[m.aId]
        const b = pending.players[m.bId]
        if (!a || !b || !m.seed || !event) continue
        out.matches++
        // instrument (a): the length every hazard weight below is built on is the ENGINE's, taken
        // off a re-simulation at the stored seed rather than counted out of a scoreline. NO
        // `condition` option is passed, deliberately: the freshness rides on the frozen players, so
        // this is the same call `MatchReplay` makes and a green arm is a green Watch button.
        const res = simulateMatch(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: m.seed })
        const score = res.sets.map((s) => `${s.a}-${s.b}`).join(' ')
        const winnerId = res.winner === 0 ? m.aId : m.bId
        if (score !== (m.score ?? '') || winnerId !== m.winnerId) out.resimMismatch++
        out.points += res.totalPoints
        out.games += (m.score ?? '').split(' ').reduce((n, set) => {
          const [g1, g2] = set.split('-').map(Number)
          return n + (g1 + g2)
        }, 0)
        const oppFrozen = m.aId === KID_ID ? b : a
        const kidFrozen = m.aId === KID_ID ? a : b
        // instrument (b): the frozen kid carries the condition she was composed at, and this file
        // read `world.condition` at the same point. They are one number written twice.
        out.arrivalChecked++
        if (kidFrozen.condition !== arrival) out.arrivalMismatch++
        if (oppFrozen.condition === undefined || kidFrozen.condition === undefined) out.freshnessAbsent++
        out.sides.push({
          hers: true,
          condition: kidFrozen.condition ?? ECONOMY.condition.max,
          hazard: hazardOver(res.totalPoints, kidFrozen.stamina),
          retired: m.retiredId === KID_ID,
        })
        out.sides.push({
          hers: false,
          condition: oppFrozen.condition ?? ECONOMY.condition.max,
          hazard: hazardOver(res.totalPoints, oppFrozen.stamina),
          retired: !!m.retiredId && m.retiredId !== KID_ID,
        })
        out.arrivals.push({ condition: arrival, retired: m.retiredId === KID_ID, points: res.totalPoints })
        if (m.retiredId) {
          out.retirements++
          if (m.retiredId === KID_ID) out.kidRetirements++
          else out.oppRetirements++
        }
        if (tier) {
          const row = out.byTier.get(tier) ?? { m: 0, r: 0 }
          row.m++
          if (m.retiredId) row.r++
          out.byTier.set(tier, row)
        }
      }
      skipTournament(world)
      closeTournament(world)
    }
  }
}

// --- the report ---------------------------------------------------------------------------------

const pct = (n: number, d: number, dp = 2) => (d === 0 ? '   n/a' : `${((100 * n) / d).toFixed(dp)}%`)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

const byArm = new Map<ArmId, ArmOut>()
for (const arm of ARMS) {
  const out = emptyArm()
  for (let s = 0; s < CAREERS; s++) walk(arm, s, out)
  byArm.set(arm, out)
}
const pooled = ARMS.flatMap((a) => byArm.get(a)!.sides)

console.log(
  `RETIRE_K = ${RETIRE_K}   durability pivot ${RETIRE_DURABILITY_PIVOT} span ${RETIRE_DURABILITY_SPAN}` +
    `   ${CAREERS} careers x ${WEEKS} weeks x ${ARMS.length} arms`,
)

console.log('\n--- INSTRUMENT CHECK (read this before any number below) ---')
for (const arm of ARMS) {
  const o = byArm.get(arm)!
  console.log(
    `  ${arm.padEnd(7)} re-sim mismatches ${String(o.resimMismatch).padStart(4)}/${String(o.matches).padStart(5)}` +
      `   ${o.resimMismatch === 0 ? 'THE SNAPSHOT IS THE MATCH THAT WAS PLAYED - AND IT REPLAYS' : '⚠ MISMATCH - every number below is void'}`,
  )
  console.log(
    `          frozen kid condition == the arrival read here: ${o.arrivalChecked - o.arrivalMismatch}/${o.arrivalChecked}` +
      `   ${o.arrivalMismatch === 0 ? '<- the body is read BEFORE finalize' : '⚠ the read is on the wrong side of finalize'}` +
      `   · sides with no composed freshness at all: ${o.freshnessAbsent}`,
  )
}

console.log('\n--- 1. THE LEVEL, PER ARM (research anchor: 2.73% of matches, either player) ---')
console.log('    arm       matches   ret    rate      hers     opp      /1000 games   mean arrival')
for (const arm of ARMS) {
  const o = byArm.get(arm)!
  const meanArrival = o.arrivals.length ? sum(o.arrivals.map((a) => a.condition)) / o.arrivals.length : 0
  console.log(
    `    ${arm.padEnd(8)}  ${String(o.matches).padStart(7)}   ${String(o.retirements).padStart(3)}` +
      `   ${pct(o.retirements, o.matches).padStart(6)}   ${pct(o.kidRetirements, o.matches).padStart(6)}` +
      `   ${pct(o.oppRetirements, o.matches).padStart(6)}   ${((1000 * o.retirements) / Math.max(1, o.games)).toFixed(2).padStart(11)}` +
      `   ${meanArrival.toFixed(1).padStart(12)}`,
  )
}
{
  const m = sum(ARMS.map((a) => byArm.get(a)!.matches))
  const r = sum(ARMS.map((a) => byArm.get(a)!.retirements))
  console.log(`    ${'POOLED'.padEnd(8)}  ${String(m).padStart(7)}   ${String(r).padStart(3)}   ${pct(r, m).padStart(6)}   <- graded against 2.73%`)
}

console.log('\n--- 2. ⭐ THE RATE BY ARRIVAL CONDITION - the axis the old bench could not see ---')
const BUCKETS: [string, (c: number) => boolean][] = [
  ['>= 90', (c) => c >= 90],
  ['80-89', (c) => c >= 80 && c < 90],
  ['70-79', (c) => c >= 70 && c < 80],
  ['60-69', (c) => c >= 60 && c < 70],
  ['< 60 ', (c) => c < 60],
]
{
  const all = ARMS.flatMap((a) => byArm.get(a)!.arrivals)
  console.log('    arrival    matches   her ret   rate     +-1 s.e.   mean pts   durability')
  for (const [label, test] of BUCKETS) {
    const cell = all.filter((r) => test(r.condition))
    if (cell.length === 0) continue
    const her = cell.filter((r) => r.retired).length
    const p = her / cell.length
    const se = 100 * Math.sqrt((p * (1 - p)) / cell.length)
    console.log(
      `    ${label}    ${String(cell.length).padStart(7)}   ${String(her).padStart(7)}   ${pct(her, cell.length).padStart(6)}` +
        `   ${se.toFixed(2).padStart(7)}%   ${(sum(cell.map((r) => r.points)) / cell.length).toFixed(0).padStart(8)}` +
        `   ${(sum(cell.map((r) => retireDurability(r.condition))) / cell.length).toFixed(3).padStart(10)}`,
    )
  }
}

console.log('\n--- 3. ⭐⭐ THE POPULATION THE PIVOT IS CENTRED ON, AND THE MEAN IT ACHIEVED ---')
console.log('    Every side of every one of her matches, weighted by the hazard it carries.')
{
  const rows: [string, SideRow[]][] = [
    ['hers', pooled.filter((s) => s.hers)],
    ['her opponents', pooled.filter((s) => !s.hers)],
    ['BOTH SIDES', pooled],
  ]
  console.log('    side             sides    Σ hazard   mean condition   HAZARD-WTD condition   mean d   HAZARD-WTD d')
  for (const [label, rs] of rows) {
    const h = sum(rs.map((s) => s.hazard))
    const wtdCond = h > 0 ? sum(rs.map((s) => s.hazard * s.condition)) / h : 0
    const wtdD = h > 0 ? sum(rs.map((s) => s.hazard * retireDurability(s.condition))) / h : 0
    const meanD = rs.length ? sum(rs.map((s) => retireDurability(s.condition))) / rs.length : 0
    const meanCond = rs.length ? sum(rs.map((s) => s.condition)) / rs.length : 0
    console.log(
      `    ${label.padEnd(15)}${String(rs.length).padStart(7)}   ${h.toFixed(1).padStart(9)}` +
        `   ${meanCond.toFixed(2).padStart(14)}   ${wtdCond.toFixed(2).padStart(20)}` +
        `   ${meanD.toFixed(3).padStart(6)}   ${wtdD.toFixed(4).padStart(12)}`,
    )
  }
  const h = sum(pooled.map((s) => s.hazard))
  const wtdCond = h > 0 ? sum(pooled.map((s) => s.hazard * s.condition)) / h : 0
  const wtdD = h > 0 ? sum(pooled.map((s) => s.hazard * retireDurability(s.condition))) / h : 0
  console.log(
    `\n    ⭐ PIVOT WANTED ${wtdCond.toFixed(2)} (the hazard-weighted mean condition of everybody who steps on court)` +
      `\n       PIVOT SET    ${RETIRE_DURABILITY_PIVOT}   ->  mean multiplier ${wtdD.toFixed(4)}` +
      `   ${Math.abs(wtdD - 1) < 0.005 ? '<- a redistribution: the LEVEL is untouched' : '⚠ THE LEVEL HAS MOVED - re-centre the pivot'}`,
  )
}

console.log('\n--- 4. BY TIER - nothing in the hazard reads the tier, so this spread is match LENGTH alone ---')
{
  const merged = new Map<TierId, { m: number; r: number }>()
  for (const arm of ARMS) {
    for (const [t, row] of byArm.get(arm)!.byTier) {
      const cur = merged.get(t) ?? { m: 0, r: 0 }
      cur.m += row.m
      cur.r += row.r
      merged.set(t, cur)
    }
  }
  for (const tier of TIER_LADDER) {
    const row = merged.get(tier)
    if (!row || row.m === 0) continue
    console.log(`  ${TIERS[tier].label.padEnd(22)} ${String(row.m).padStart(6)} matches   ${String(row.r).padStart(4)} ret   ${pct(row.r, row.m)}`)
  }
}
