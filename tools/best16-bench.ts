// THE BEST-16 RECEIPT (W2-LADDER §3's own ⚠): "best-16 is a balance change disguised as a rule
// change. Bench the same seeds before/after the switch, as its own receipt, or we will not know
// what moved the reach numbers."
//
//   npx vite-node tools/best16-bench.ts [--seeds N] [--weeks N]
//
// TWO ARMS, SAME SEEDS, SAME POLICY, ONE KNOB: arm A patches BEST_N_BY_TRACK.wta back to 6
// (best-6 everywhere - the pre-W2-LADDER rule) and arm B runs the shipped split
// {domestic 6, itf 6, wta 16}. The patch-and-restore idiom is the fatigue bench's
// (`matchWeekRecoveryBase`), and the knob's own comment names this file as the licensed writer.
//
// THE CAREER is a real engine career under a simple honest policy, not a synthetic book: greedy
// strongest-tier-first entries whenever she is genuinely fresh (condition >= 70, the strength
// knee - a policy that grinds her under it plays every match debuffed and measures the debuff,
// not the window), every pending run played out
// (skipTournament reveals and finalizes - she PLAYS it), funds topped up so affordability never
// decides an entry - the receipt is about the RULE, and money noise would smear it. The two arms
// legitimately DIVERGE in play (rankings feed acceptance cuts and entry gates), which is the
// rule's real footprint and exactly what the receipt is for.

import {
  createWorld,
  enterEvent,
  tickWeek,
  skipTournament,
  closeTournament,
  kidPoints,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { inTrack } from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 20)
const WEEKS = argOf('weeks', 416) // eight seasons: 14 -> 22, well past the W era's opening
const CHECKPOINTS = [208, 312, 416] // ages ~18 / ~20 / ~22

interface Sample {
  week: number
  wtaPoints: number
  wtaRank: number
  wEntries: number
  /** mean of the top-5 LIVE cohort rows in the wta fold - the half of the world where the window
   *  genuinely binds (a busy rival holds far more than six counting W results a season), so the
   *  receipt shows what the rule moved even where the kid's own book is thin. */
  fieldTop5: number
}

function runCareer(seed: string): Sample[] {
  const world: WorldState = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  const samples: Sample[] = []
  let wEntries = 0
  const strongestFirst = [...TIER_LADDER].reverse()
  for (let i = 0; i < WEEKS; i++) {
    world.fundsCents = Math.max(world.fundsCents, 1_000_000_00) // money never decides an entry here
    if (world.condition >= ECONOMY.condition.matchStrengthKnee) {
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
          if (TIERS[e.tier].track === 'wta') wEntries++
          break // one new entry per week keeps the policy legible
        } catch {
          /* a gate said no - the policy tries the next rung down */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (CHECKPOINTS.includes(world.week)) {
      const liveWta = computeRanking(
        world.results.filter((r) => r.playerId !== KID_ID),
        world.week,
        BEST_N_BY_TRACK.wta, // the patched knob - each arm folds under its own rule
        world.cohort.map((p) => p.id),
        inTrack('wta'),
      )
      const top5 = liveWta.slice(0, 5).reduce((s2, r) => s2 + r.points, 0) / 5
      samples.push({
        week: world.week,
        wtaPoints: kidPoints(world, 'wta'),
        wtaRank: world.kidRankWta ?? world.cohort.length + 1,
        wEntries,
        fieldTop5: top5,
      })
    }
  }
  return samples
}

interface ArmRow {
  seed: string
  byWeek: Map<number, Sample>
}

function runArm(label: string, wtaN: number): ArmRow[] {
  const shipped = BEST_N_BY_TRACK.wta
  BEST_N_BY_TRACK.wta = wtaN
  try {
    const rows: ArmRow[] = []
    for (let s = 0; s < SEEDS; s++) {
      const seed = `best16-${s}`
      const samples = runCareer(seed)
      rows.push({ seed, byWeek: new Map(samples.map((x) => [x.week, x])) })
      console.error(`  ${label}: career ${s + 1}/${SEEDS} done`)
    }
    return rows
  } finally {
    BEST_N_BY_TRACK.wta = shipped
  }
}

const armA = runArm('best-6', 6)
const armB = runArm('best-16', 16)

console.log(`BEST-16 RECEIPT - ${SEEDS} seeds x ${WEEKS} weeks, same policy, arms best-6 vs best-16 (wta only)`)
for (const week of CHECKPOINTS) {
  const rows = armA
    .map((a, i) => ({ a: a.byWeek.get(week), b: armB[i].byWeek.get(week), seed: a.seed }))
    .filter((r) => r.a && r.b) as { a: Sample; b: Sample; seed: string }[]
  if (!rows.length) continue
  const dPts = rows.map((r) => r.b.wtaPoints - r.a.wtaPoints)
  const dRank = rows.map((r) => r.b.wtaRank - r.a.wtaRank) // negative = best-16 ranks her higher
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  const med = (xs: number[]) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)]
  console.log(`  week ${week} (age ~${14 + Math.floor(week / 52)}):`)
  console.log(
    `    wta points  A mean ${mean(rows.map((r) => r.a.wtaPoints)).toFixed(1)} -> B mean ${mean(rows.map((r) => r.b.wtaPoints)).toFixed(1)}` +
      `  delta mean ${mean(dPts).toFixed(1)} median ${med(dPts)} min ${Math.min(...dPts)} max ${Math.max(...dPts)}`,
  )
  console.log(
    `    wta rank    A mean ${mean(rows.map((r) => r.a.wtaRank)).toFixed(1)} -> B mean ${mean(rows.map((r) => r.b.wtaRank)).toFixed(1)}` +
      `  delta mean ${mean(dRank).toFixed(1)} median ${med(dRank)} (negative = best-16 ranks her higher)`,
  )
  console.log(
    `    W entries   A mean ${mean(rows.map((r) => r.a.wEntries)).toFixed(1)} -> B mean ${mean(rows.map((r) => r.b.wEntries)).toFixed(1)}`,
  )
  console.log(
    `    live field top-5 wta pts  A mean ${mean(rows.map((r) => r.a.fieldTop5)).toFixed(1)} -> B mean ${mean(rows.map((r) => r.b.fieldTop5)).toFixed(1)}` +
      `  (the window's real footprint: a busy rival fills sixteen slots long before the kid does)`,
  )
}
console.log(`(KID_ID ${KID_ID} careers; per-seed rows suppressed - re-run with --seeds 3 to eyeball raw careers)`)
