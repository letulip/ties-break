/**
 * THE REHAB-DEVELOPMENT LEVER (detail/injury-arms, arm 2, owner: injuries should cost progress).
 *
 * The engine today develops THROUGH rehab: `growWeek` (tick step 3b) has no injury gate – the
 * match-learning bonus is all a layoff costs. This tool prices the lever that changes that:
 * rehab weeks develop at fraction F, long layoffs (> TB_REHAB_LONG weeks) at 0 in sub-100% arms.
 *
 * MEASUREMENT ONLY. Reuses the fatigue bench's own machinery (openFatigueCareer / stepFatigueWeek)
 * on the same cells the injury-landscape walked (4 profiles x 3 policies x paired seeds), and adds
 * the development-side columns the flip question needs: end skills, points, ranked careers, first
 * ranked week. The lever itself is a MEASUREMENT-LOCAL, uncommitted patch on the growWeek call
 * site's `loadFactor` channel, read from TB_REHAB_F / TB_REHAB_LONG; the §6 dose rides TB_SUBKNEE_K
 * exactly as in tools/injury-landscape.ts. Active doses are printed in the header so no arm's
 * output can be misfiled. See docs/specs/the-injury-landscape-2026-08.md §8.
 *
 * Run:  npx vite-node tools/rehab-lever.ts [--seeds N] [--horizon W]
 *       TB_REHAB_F=0.3 TB_SUBKNEE_K=8 TB_SUBKNEE_JUNIOR=1 npx vite-node tools/rehab-lever.ts
 */
process.env.TB_BENCH_NO_AUTORUN = '1'

import { ECONOMY } from '../src/engine/economy'
import { kidPoints } from '../src/engine/world'
import { SKILL_KEYS } from '../src/engine/development'
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
  weeksLost: number
  matches: number
  wins: number
  endPoints: number
  everRanked: boolean
  /** first week kidPoints('itf') > 0, or null – the "first points" calibration read */
  firstRankedWeek: number | null
  endSkillMean: number
  /** growth actually banked: end minus start, mean over the 5 skills */
  skillGain: number
}

function runCareer(profile: Profile, policy: Policy, seed: number): CareerRow {
  const { world, rng } = openFatigueCareer(profile, policy, seed)
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const skillMean = () => SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0) / SKILL_KEYS.length
  const startSkill = skillMean()
  const row: CareerRow = {
    profile: profile.label,
    policy: policy.id,
    seed,
    onsets: 0,
    weeksLost: 0,
    matches: 0,
    wins: 0,
    endPoints: 0,
    everRanked: false,
    firstRankedWeek: null,
    endSkillMean: 0,
    skillGain: 0,
  }
  for (let i = 0; i < HORIZON; i++) {
    const f = stepFatigueWeek(world, rng, policy, plannerState)
    if (f.injuryOnset) row.onsets++
    if (f.injured) row.weeksLost++
    row.matches += f.matchScores.length
    row.wins += f.wins
    if (row.firstRankedWeek === null && kidPoints(world, 'itf') > 0) row.firstRankedWeek = world.week
  }
  row.everRanked = row.firstRankedWeek !== null
  row.endPoints = kidPoints(world, 'itf')
  row.endSkillMean = skillMean()
  row.skillGain = row.endSkillMean - startSkill
  return row
}

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

console.log(
  `THE REHAB-DEVELOPMENT LEVER – ${SEEDS} seeds x ${PROFILES.length} profiles x ${POLICIES.length} policies, ${HORIZON}w` +
    `  ·  TB_REHAB_F=${process.env.TB_REHAB_F ?? '1 (shipped)'}  TB_REHAB_LONG=${process.env.TB_REHAB_LONG ?? '4'}` +
    `  TB_SUBKNEE_K=${process.env.TB_SUBKNEE_K ?? '0 (shipped)'}  junior-gated=${process.env.TB_SUBKNEE_JUNIOR ?? '0'}` +
    `  ·  knee=${ECONOMY.condition.matchStrengthKnee}`,
)

const header =
  pad('cell', 14) +
  padL('n', 4) +
  padL('onsets', 8) +
  '  ' +
  pad('SEM', 6) +
  padL('wksLost', 8) +
  '  ' +
  pad('SEM', 5) +
  padL('matches', 8) +
  padL('endSkill', 9) +
  '  ' +
  pad('SEM', 6) +
  padL('gain', 6) +
  padL('endPts', 8) +
  '  ' +
  pad('SEM', 6) +
  padL('ranked', 7) +
  padL('1stPtsWk', 9)

function printCell(label: string, rs: CareerRow[]): void {
  const ranked = rs.filter((r) => r.firstRankedWeek !== null)
  console.log(
    pad(label, 14) +
      padL(rs.length, 4) +
      padL(mean(rs, (r) => r.onsets).toFixed(2), 8) +
      ' ±' +
      pad(sem(rs, (r) => r.onsets).toFixed(2), 6) +
      padL(mean(rs, (r) => r.weeksLost).toFixed(1), 8) +
      ' ±' +
      pad(sem(rs, (r) => r.weeksLost).toFixed(1), 5) +
      padL(mean(rs, (r) => r.matches).toFixed(1), 8) +
      padL(mean(rs, (r) => r.endSkillMean).toFixed(2), 9) +
      ' ±' +
      pad(sem(rs, (r) => r.endSkillMean).toFixed(2), 6) +
      padL(mean(rs, (r) => r.skillGain).toFixed(2), 6) +
      padL(mean(rs, (r) => r.endPoints).toFixed(0), 8) +
      ' ±' +
      pad(sem(rs, (r) => r.endPoints).toFixed(0), 6) +
      padL(`${ranked.length}/${rs.length}`, 7) +
      padL(ranked.length > 0 ? (ranked.reduce((a, r) => a + (r.firstRankedWeek ?? 0), 0) / ranked.length).toFixed(0) : '-', 9),
  )
}

console.log('\nPER POLICY (pooled over the 4 profiles)')
console.log(header)
for (const pol of POLICIES) printCell(pol.id, rows.filter((r) => r.policy === pol.id))
