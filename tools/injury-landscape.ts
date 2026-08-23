/**
 * THE INJURY LANDSCAPE (detail/injuries-measure, owner ask 23.08: «про травмы больше детализаций с
 * измерениями и выкладками») – the junior-era injury table the §6 ruling needs, per cell with SEM.
 *
 * MEASUREMENT ONLY. Reuses the fatigue bench's own machinery (openFatigueCareer / stepFatigueWeek)
 * so every career here walks exactly the cells the doctor's ledger walked – this tool adds columns
 * (severity mix, sub-knee exposure, per-100-match rates, SEM), never a second implementation.
 *
 * THE DOSE ARM LABEL: the §6 sub-knee sweep runs against a measurement-local engine patch that
 * reads TB_SUBKNEE_K (tau *= 1 + K·(knee−condition)/knee below the knee; unset/0 = shipped).
 * The active K is printed in the header so no arm's output can be misfiled. The patch itself is
 * never committed – see docs/specs/the-injury-landscape-2026-08.md.
 *
 * Run:  npx vite-node tools/injury-landscape.ts [--seeds N] [--horizon W]
 *       TB_SUBKNEE_K=1.5 npx vite-node tools/injury-landscape.ts   (a dose arm)
 */
process.env.TB_BENCH_NO_AUTORUN = '1'

import { ECONOMY } from '../src/engine/economy'
import { kidPoints } from '../src/engine/world'
import type { InjurySeverity } from '../src/shared/protocol'
import type { Policy, Profile } from './fatigue-bench'

const { PROFILES, POLICIES, openFatigueCareer, stepFatigueWeek } = await import('./fatigue-bench')

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 10)
const HORIZON = argOf('horizon', 104)

interface CareerRow {
  profile: string
  policy: string
  seed: number
  onsets: number
  /** the two doors (injury-cause-probe's own text markers): the weekly roll vs the on-court
   *  retirement. The §6 lever moves ONLY the weekly door, so this split bounds what it can do. */
  onsetsWeekly: number
  onsetsRetire: number
  bySeverity: Record<InjurySeverity, number>
  /** weeks that closed with her out injured – the "weeks lost" the ledger reports */
  weeksLost: number
  careerEndingInjury: boolean
  matches: number
  wins: number
  entries: number
  playWeeks: number
  /** play weeks whose PRE-TICK condition (exactly what injuryTau reads at step 1c) was < knee */
  playWeeksSubKnee: number
  weeksSubKnee: number
  weeksBelowFloor: number
  meanPreCondition: number
  endPoints: number
  everRanked: boolean
}

function runCareer(profile: Profile, policy: Policy, seed: number): CareerRow {
  const { world, rng } = openFatigueCareer(profile, policy, seed)
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const knee = ECONOMY.condition.matchStrengthKnee
  const floor = ECONOMY.availability.medicalFloor
  const row: CareerRow = {
    profile: profile.label,
    policy: policy.id,
    seed,
    onsets: 0,
    onsetsWeekly: 0,
    onsetsRetire: 0,
    bySeverity: { minor: 0, moderate: 0, major: 0, severe: 0 },
    weeksLost: 0,
    careerEndingInjury: false,
    matches: 0,
    wins: 0,
    entries: 0,
    playWeeks: 0,
    playWeeksSubKnee: 0,
    weeksSubKnee: 0,
    weeksBelowFloor: 0,
    meanPreCondition: 0,
    endPoints: 0,
    everRanked: false,
  }
  let condSum = 0
  for (let i = 0; i < HORIZON; i++) {
    // The condition rollInjury will read this tick: tickWeek increments the week and rolls at step
    // 1c BEFORE accrueCondition, so the pre-step value is byte-exactly the tau operand.
    const preCondition = world.condition
    condSum += preCondition
    if (preCondition < knee) row.weeksSubKnee++
    if (preCondition < floor) row.weeksBelowFloor++
    const eidBefore = world.nextEventId
    const f = stepFatigueWeek(world, rng, policy, plannerState)
    if (f.injuryOnset) {
      row.onsets++
      row.bySeverity[f.injuryOnset.severity]++
      // Which door – read off the news feed the way injury-cause-probe reads it: the retirement
      // door's sentences are "She had to stop…" / "She stopped, and this time it is serious…".
      const retired = world.events.some(
        (ev) =>
          ev.id >= eidBefore &&
          ev.type === 'injury' &&
          (ev.text.startsWith('She had to stop') || ev.text.startsWith('She stopped,')),
      )
      if (retired) row.onsetsRetire++
      else row.onsetsWeekly++
    }
    if (f.injured) row.weeksLost++
    if (f.played) {
      row.playWeeks++
      if (preCondition < knee) row.playWeeksSubKnee++
    }
    row.matches += f.matchScores.length
    row.wins += f.wins
    row.entries += f.entriesCommitted
    if (kidPoints(world, 'itf') > 0) row.everRanked = true
  }
  row.meanPreCondition = condSum / HORIZON
  row.careerEndingInjury = world.ending?.type === 'injury'
  row.endPoints = kidPoints(world, 'itf')
  return row
}

// --- run the full matrix -------------------------------------------------------

const rows: CareerRow[] = []
for (const prof of PROFILES) {
  for (const pol of POLICIES) {
    for (let s = 0; s < SEEDS; s++) rows.push(runCareer(prof, pol, s))
  }
}

const sum = (rs: CareerRow[], f: (r: CareerRow) => number) => rs.reduce((a, r) => a + f(r), 0)
const mean = (rs: CareerRow[], f: (r: CareerRow) => number) => sum(rs, f) / rs.length
const sem = (rs: CareerRow[], f: (r: CareerRow) => number) => {
  const m = mean(rs, f)
  const v = rs.reduce((a, r) => a + (f(r) - m) ** 2, 0) / (rs.length - 1)
  return Math.sqrt(v / rs.length)
}
const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

const K = process.env.TB_SUBKNEE_K ?? '0 (shipped)'
const CAP = process.env.TB_INJ_CAP ?? `${ECONOMY.availability.injuryChanceCap} (shipped)`
console.log(
  `THE INJURY LANDSCAPE – ${SEEDS} seeds x ${PROFILES.length} profiles x ${POLICIES.length} policies, ` +
    `${HORIZON}w  ·  TB_SUBKNEE_K=${K}  cap=${CAP}  kneeOverride=${process.env.TB_SUBKNEE_KNEE ?? 'none'}  ·  knee=${ECONOMY.condition.matchStrengthKnee} floor=${ECONOMY.availability.medicalFloor}`,
)

function printCell(label: string, rs: CareerRow[]): void {
  const inj100 = (100 * sum(rs, (r) => r.onsets)) / Math.max(1, sum(rs, (r) => r.matches))
  const sev = (['minor', 'moderate', 'major', 'severe'] as const).map((s) => sum(rs, (r) => r.bySeverity[s]))
  console.log(
    pad(label, 44) +
      padL(rs.length, 4) +
      padL(mean(rs, (r) => r.onsets).toFixed(2), 8) +
      ' ±' +
      pad(sem(rs, (r) => r.onsets).toFixed(2), 6) +
      padL(sev.join('/'), 13) +
      padL(`${sum(rs, (r) => r.onsetsWeekly)}/${sum(rs, (r) => r.onsetsRetire)}`, 9) +
      padL(mean(rs, (r) => r.weeksLost).toFixed(1), 8) +
      ' ±' +
      pad(sem(rs, (r) => r.weeksLost).toFixed(1), 5) +
      padL(sum(rs, (r) => (r.careerEndingInjury ? 1 : 0)), 4) +
      padL(mean(rs, (r) => r.matches).toFixed(1), 9) +
      padL(inj100.toFixed(2), 8) +
      padL(((100 * sum(rs, (r) => r.playWeeksSubKnee)) / Math.max(1, sum(rs, (r) => r.playWeeks))).toFixed(0) + '%', 9) +
      padL(((100 * sum(rs, (r) => r.weeksSubKnee)) / (rs.length * HORIZON)).toFixed(0) + '%', 8) +
      padL(((100 * sum(rs, (r) => r.weeksBelowFloor)) / (rs.length * HORIZON)).toFixed(1) + '%', 8) +
      padL(mean(rs, (r) => r.meanPreCondition).toFixed(0), 6) +
      padL(rs.filter((r) => r.everRanked).length, 7),
  )
}

const header =
  pad('cell', 44) +
  padL('n', 4) +
  padL('onsets', 8) +
  '  ' +
  pad('SEM', 6) +
  padL('mi/mo/ma/se', 13) +
  padL('wk/ret', 9) +
  padL('wksLost', 8) +
  '  ' +
  pad('SEM', 5) +
  padL('end', 4) +
  padL('matches', 9) +
  padL('inj/100m', 8) +
  padL('playSubK', 9) +
  padL('wk<knee', 8) +
  padL('wk<flr', 8) +
  padL('cond', 6) +
  padL('ranked', 7)

console.log('\nPER POLICY (pooled over the 4 profiles)')
console.log(header)
for (const pol of POLICIES) printCell(pol.id, rows.filter((r) => r.policy === pol.id))

console.log('\nPER PRESET x POLICY')
console.log(header)
for (const prof of PROFILES) {
  for (const pol of POLICIES) {
    printCell(`${prof.label} · ${pol.id}`, rows.filter((r) => r.profile === prof.label && r.policy === pol.id))
  }
}

// The §6 headline pair, stated the way the ruling will be judged: per-match dose for the grinder
// against the managed pool, plus the careful policy alone (the owner's own play style).
const g = rows.filter((r) => r.policy === 'grinder')
const managed = rows.filter((r) => r.policy !== 'grinder')
const careful = rows.filter((r) => r.policy === 'careful')
const r100 = (rs: CareerRow[]) => (100 * sum(rs, (r) => r.onsets)) / Math.max(1, sum(rs, (r) => r.matches))
console.log(
  `\nHEADLINE: inj/100 matches grinder=${r100(g).toFixed(2)} managed=${r100(managed).toFixed(2)} ` +
    `careful=${r100(careful).toFixed(2)} ratio(g/managed)=${(r100(g) / r100(managed)).toFixed(2)}x ` +
    `| onsets/career grinder=${mean(g, (r) => r.onsets).toFixed(2)}±${sem(g, (r) => r.onsets).toFixed(2)} ` +
    `careful=${mean(careful, (r) => r.onsets).toFixed(2)}±${sem(careful, (r) => r.onsets).toFixed(2)}`,
)
