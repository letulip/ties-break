/**
 * injury-ratio-probe – WHY THE GRINDER/CAREFUL INJURY RATIO IS WHAT IT IS, decomposed.
 *
 * The owner, 10.08, on the `> 1.5` corridor in tests/fatigue-bench-policy-104w.test.ts:
 * «разве гриндер и так не в зоне риска живет? У нас там вроде должна быть уже повышена
 * вероятность травмы, разве нет?»
 *
 * It is a fair question and the test cannot answer it, because the test asserts a RATIO OF COUNTS
 * and a count is a hazard times an exposure. Every re-read in that file's fifty-line comment block
 * has found the same thing – "the grinder did not move, everything that moved is the careful
 * parent's" – which is a statement about EXPOSURE that the ratio alone cannot express.
 *
 * So this splits the ratio into its two factors and prints both:
 *
 *     injuries          weeks she competed         injuries per competing week
 *     ────────     =    ──────────────────    ×    ───────────────────────────
 *      (count)             (exposure)                      (hazard)
 *
 * If the hazard ratio is high and the exposure ratio is low, the grinder IS in the risk zone
 * exactly as the owner expects, and the counts are being levelled by the doctor's veto refusing her
 * the tournaments in which the risk would be realised. That is a different finding from "the injury
 * model is too flat", and it has a different fix.
 *
 * ⚠ MEASUREMENT ONLY. Imports the bench and the engine read-only, changes no constant.
 *
 * Run:  npx vite-node tools/injury-ratio-probe.ts -- [--seeds 10] [--weeks 104]
 */
// ⚠ MUST come before the dynamic import below, and a STATIC import of the bench would be a bug.
// fatigue-bench.ts self-runs its whole `main()` on import outside vitest
// (`if (!process.env.VITEST && !process.env.TB_BENCH_NO_AUTORUN)`), so a hoisted static import runs
// the entire multi-section sweep before this file does anything – measured here: the probe sat for
// minutes printing the full bench. Same escape hatch and same shape as tools/points-curve.ts.
process.env.TB_BENCH_NO_AUTORUN = '1'
const { PROFILES, POLICIES, runCell } = await import('./fatigue-bench')

import { ECONOMY } from '../src/engine/economy'

/** Only the fields this probe reads, so it does not import the bench's type statically. */
interface Run {
  injuriesTotal: number
  entries: number
  matchesPlayed: number
  weeksInjured: number
  meanCondition: number
  medicalBlocks: number
}

function n(x: number, w = 7, d = 2): string {
  return x.toFixed(d).padStart(w)
}

interface Pooled {
  injuries: number
  entries: number
  matches: number
  weeks: number
  weeksInjured: number
  meanCond: number
  medicalBlocks: number
  careers: number
}

function pool(runs: Run[], horizon: number): Pooled {
  const sum = (f: (r: Run) => number) => runs.reduce((s, r) => s + f(r), 0)
  return {
    injuries: sum((r) => r.injuriesTotal),
    entries: sum((r) => r.entries),
    matches: sum((r) => r.matchesPlayed),
    weeks: runs.length * horizon,
    weeksInjured: sum((r) => r.weeksInjured),
    meanCond: sum((r) => r.meanCondition) / runs.length,
    medicalBlocks: sum((r) => r.medicalBlocks ?? 0),
    careers: runs.length,
  }
}

function main(): void {
  const args = process.argv.slice(2)
  const seeds = Number(args[args.indexOf('--seeds') + 1]) || 10
  const horizon = Number(args[args.indexOf('--weeks') + 1]) || 104

  const working = PROFILES.find((p) => p.background === 'working')!
  const middleSelf = PROFILES.find((p) => p.background === 'middle' && p.coachTier === 'self')!
  const grinder = POLICIES.find((p) => p.id === 'grinder')!
  const careful = POLICIES.find((p) => p.id === 'careful')!

  console.log(`\ninjury-ratio-probe · ${seeds} paired seeds × 2 profiles · ${horizon} weeks · same cells as the 104w anchor\n`)

  const g = pool([...runCell(working, grinder, horizon, seeds), ...runCell(middleSelf, grinder, horizon, seeds)], horizon)
  const c = pool([...runCell(working, careful, horizon, seeds), ...runCell(middleSelf, careful, horizon, seeds)], horizon)

  const ratio = g.injuries / c.injuries
  console.log(`THE NUMBER THE TEST ASSERTS`)
  console.log(`  grinder ${g.injuries} injuries / careful ${c.injuries} = ${n(ratio, 5)}   (bounds: > 1.5, < 2.5)\n`)

  console.log(`THE TWO FACTORS IT IS MADE OF`)
  console.log(`                                  grinder   careful     ratio`)
  console.log(`  careers                       ${n(g.careers, 9, 0)} ${n(c.careers, 9, 0)}`)
  console.log(`  weeks lived                   ${n(g.weeks, 9, 0)} ${n(c.weeks, 9, 0)}`)
  console.log(`  mean condition                 ${n(g.meanCond, 8, 1)}  ${n(c.meanCond, 8, 1)}`)
  console.log(`  ── EXPOSURE ──`)
  console.log(`  tournament entries            ${n(g.entries, 9, 0)} ${n(c.entries, 9, 0)}  ${n(g.entries / c.entries, 8, 3)}`)
  console.log(`  matches played                ${n(g.matches, 9, 0)} ${n(c.matches, 9, 0)}  ${n(g.matches / c.matches, 8, 3)}`)
  console.log(`  ── HAZARD ──`)
  console.log(
    `  injuries per entry             ${n(g.injuries / g.entries, 8, 4)}  ${n(c.injuries / c.entries, 8, 4)}  ${n(g.injuries / g.entries / (c.injuries / c.entries), 8, 3)}`,
  )
  console.log(
    `  injuries per match             ${n(g.injuries / g.matches, 8, 4)}  ${n(c.injuries / c.matches, 8, 4)}  ${n(g.injuries / g.matches / (c.injuries / c.matches), 8, 3)}`,
  )
  console.log(
    `  injuries per week lived        ${n(g.injuries / g.weeks, 8, 4)}  ${n(c.injuries / c.weeks, 8, 4)}  ${n(g.injuries / g.weeks / (c.injuries / c.weeks), 8, 3)}`,
  )
  console.log(`  ── CONSEQUENCE ──`)
  console.log(`  weeks spent injured           ${n(g.weeksInjured, 9, 0)} ${n(c.weeksInjured, 9, 0)}  ${n(g.weeksInjured / c.weeksInjured, 8, 3)}`)
  if (g.medicalBlocks || c.medicalBlocks) {
    console.log(`  entries refused by the doctor  ${n(g.medicalBlocks, 8, 0)}  ${n(c.medicalBlocks, 8, 0)}`)
  }

  // What the model SAYS her weekly chance is at each policy's mean condition, before the age,
  // consecutive-play and playing multipliers. This is the "is the grinder in the risk zone"
  // question answered from the knobs rather than from the counts.
  const a = ECONOMY.availability
  const tauAt = (cond: number) => Math.min(a.injuryBaseChance + (100 - cond) * a.injuryFatigueSlope, a.injuryChanceCap)
  console.log(`\nTHE HAZARD THE MODEL INTENDS, at each policy's mean condition`)
  console.log(`  base ${a.injuryBaseChance} + fatigue × ${a.injuryFatigueSlope}, capped at ${a.injuryChanceCap}`)
  console.log(`  grinder  condition ${g.meanCond.toFixed(1)} → fatigue ${(100 - g.meanCond).toFixed(1)} → tau ${tauAt(g.meanCond).toFixed(5)}`)
  console.log(`  careful  condition ${c.meanCond.toFixed(1)} → fatigue ${(100 - c.meanCond).toFixed(1)} → tau ${tauAt(c.meanCond).toFixed(5)}`)
  console.log(`  intended fatigue-only separation: ${(tauAt(g.meanCond) / tauAt(c.meanCond)).toFixed(3)}×`)
  console.log(
    `  ⚠ the cap ${a.injuryChanceCap} binds at condition ${(100 - (a.injuryChanceCap - a.injuryBaseChance) / a.injuryFatigueSlope).toFixed(0)} – ` +
      `at condition 0 the fatigue term reaches only ${tauAt(0).toFixed(5)}, so the cap is unreachable and does NOT flatten the grinder.`,
  )
}

main()
