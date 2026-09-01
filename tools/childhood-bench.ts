// THE CHILDHOOD BENCH – the prologue's phase 1, measured (docs/specs/childhood-growth-2026-09.md).
//
// Two halves, and the first one exists so the second is measured against something real:
//
//   PART A – THE CONTROL. Reproduce the build spec's §1a on THIS tree: `ageFactor` below 13 is
//   clamped to `peakRate`, so a prologue walked through `growWeek` hands out 2.84x the age term of
//   the whole 14->18 window. Printed before anything the branch adds is called.
//
//   PART B – THE AFTER. `childhoodArrival` walked from 5, against the band a freshly created
//   fourteen-year-old occupies today. The acceptance criterion is the overlap of those two
//   distributions, so both are printed with their quantiles rather than summarised.
//
// ⚠ NO WORLD IS BUILT AND NO TICK IS RUN. Everything here is pure arithmetic over `development.ts`
// and `childhood.ts`, so the bench cannot move the MAIN stream even by accident.
import {
  ageFactor,
  growWeek,
  rollPotential,
  SKILL_KEYS,
  STARTING_SKILL_BAND,
  type KidSkills,
} from '../src/engine/development'
import { startingSkills, withHeadStart } from '../src/engine/world/player'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { WEEKS_IN_SEASON } from '../src/shared/dates'
import {
  appetiteAt,
  CHILDHOOD,
  childhoodArrival,
  childhoodWalk,
  neglectedChildhood,
  medianChildhood,
  devotedChildhood,
  type ChildhoodYear,
} from '../src/engine/childhood'

const SEEDS = 20000

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
function quantile(sorted: number[], q: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
}
function f(n: number, d = 2): string {
  return n.toFixed(d).padStart(7)
}

// =================================================================================================
// PART A – THE CONTROL
// =================================================================================================

console.log('=== PART A – THE CONTROL: today\'s curve below 13 (build spec §1a, re-measured here) ===\n')

const ages = [6, 8, 10, 12, 13, 14, 16, 18]
console.log('age       ' + ages.map((a) => String(a).padStart(8)).join(''))
console.log('ageFactor ' + ages.map((a) => ageFactor(a).toFixed(5).padStart(8)).join(''))

function ageTermOver(from: number, to: number): { sum: number; weeks: number } {
  let sum = 0
  let weeks = 0
  for (let age = from; age < to - 1e-9; age += 1 / WEEKS_IN_SEASON) {
    sum += ageFactor(age)
    weeks++
  }
  return { sum, weeks }
}

const prologue6 = ageTermOver(6, 14)
const prologue5 = ageTermOver(5, 14)
const game18 = ageTermOver(14, 18)
const game23 = ageTermOver(14, 23)
console.log('')
console.log(`prologue 6 -> 14   ${f(prologue6.sum)}  over ${prologue6.weeks} weeks`)
console.log(`prologue 5 -> 14   ${f(prologue5.sum)}  over ${prologue5.weeks} weeks`)
console.log(`the game 14 -> 18  ${f(game18.sum)}  over ${game18.weeks} weeks`)
console.log(`the game 14 -> 23  ${f(game23.sum)}  over ${game23.weeks} weeks`)
console.log('')
console.log(`6->14 is ${(prologue6.sum / game18.sum).toFixed(2)}x the 14->18 window, ` +
  `${((prologue6.sum / game23.sum) * 100).toFixed(0)}% of 14->23`)
console.log(`5->14 is ${(prologue5.sum / game18.sum).toFixed(2)}x the 14->18 window, ` +
  `${((prologue5.sum / game23.sum) * 100).toFixed(0)}% of 14->23`)

// The same blow-out made physical: walk `growWeek` from 5 and see where she stands at fourteen.
// Balanced plan, no coach, no matches – the cheapest possible childhood the existing engine can
// describe, which is what makes the number damning rather than a tuning artefact.
function walkGrowWeek(seed: string, fromAge: number, toAge: number, start: KidSkills, potential: KidSkills): KidSkills {
  let skills = start
  let week = 0
  for (let age = fromAge; age < toAge - 1e-9; age += 1 / WEEKS_IN_SEASON, week++) {
    skills = growWeek({
      skills,
      potential,
      ageYears: age,
      plan: WEEK_PLAN_PRESETS.balanced,
      coach: null,
      playStyle: DEFAULT_PROFILE.playStyle,
      matchesThisWeek: 0,
      seed,
      week,
    })
  }
  return skills
}

const controlShare: number[] = []
const controlMean: number[] = []
for (let i = 0; i < 2000; i++) {
  const seed = `bench-control-${i}`
  const born = startingSkills(seed, DEFAULT_PROFILE)
  const potential = rollPotential(seed, born)
  const at14 = walkGrowWeek(seed, 5, 14, born, potential)
  // how much of the headroom she was born with has been eaten by the walk
  let taken = 0
  let room = 0
  for (const k of SKILL_KEYS) {
    taken += at14[k] - born[k]
    room += potential[k] - born[k]
  }
  controlShare.push(taken / room)
  controlMean.push(mean(SKILL_KEYS.map((k) => at14[k])))
}
console.log('')
console.log(`CONTROL WALK 5->14 through growWeek (2000 seeds, balanced plan, no coach, no matches):`)
console.log(`  headroom consumed before the game starts: ${(mean(controlShare) * 100).toFixed(1)}%`)
console.log(`  mean attribute at fourteen:               ${f(mean(controlMean))}`)

const freshMeanForControl: number[] = []
for (let i = 0; i < 2000; i++) {
  const seed = `bench-control-${i}`
  const at14 = withHeadStart(startingSkills(seed, DEFAULT_PROFILE), DEFAULT_PROFILE.birthMonth)
  freshMeanForControl.push(mean(SKILL_KEYS.map((k) => at14[k])))
}
console.log(`  a fresh fourteen-year-old today:          ${f(mean(freshMeanForControl))}`)
console.log(`  => the prologue would hand her +${f(mean(controlMean) - mean(freshMeanForControl))} points of every attribute`)

// =================================================================================================
// PART B – THE AFTER
// =================================================================================================

console.log('\n=== PART B – THE AFTER: childhoodArrival, 5 -> 14 ===\n')

const paths: Array<{ name: string; years: readonly ChildhoodYear[] }> = [
  { name: 'neglected', years: neglectedChildhood() },
  { name: 'median', years: medianChildhood() },
  { name: 'devoted', years: devotedChildhood() },
  // the grinder: maximum practice every year from five, which is the branch that must NOT win
  { name: 'grinder', years: medianChildhood().map((y) => ({ ...y, practice: 1, teaching: 1 })) },
  // THE SHAPE CHANNEL AT ITS EXTREME – nine years of nothing but rally work, and nine of nothing but
  // serve. Both are the most lopsided childhood the data can express, so if the band holds here it
  // holds everywhere.
  { name: 'dev+rally', years: devotedChildhood().map((y) => ({ ...y, focus: 'rally' as const })) },
  { name: 'dev+serve', years: devotedChildhood().map((y) => ({ ...y, focus: 'serve' as const })) },
  // A CHILDHOOD A REAL PLAYER WOULD PRODUCE – three quiet years, the club at eight, one-to-one from
  // nine, a light eleventh because the money ran out. This is the row to look at when asking what the
  // prologue actually does to an ordinary run.
  {
    name: 'mixed',
    years: medianChildhood().map((y) => {
      if (y.age <= 7) return { ...y, practice: 0.55 * appetiteAt(y.age), teaching: 0.2 }
      if (y.age === 11) return { ...y, practice: 0.45 * appetiteAt(y.age), teaching: 1 }
      return { ...y, practice: 0.95 * appetiteAt(y.age), teaching: 1, focus: 'rally' as const }
    }),
  },
]

console.log('per-skill support today (STARTING_SKILL_BAND, the range `startingSkills` draws from):')
for (const k of SKILL_KEYS) console.log(`  ${k.padEnd(14)} [${STARTING_SKILL_BAND[k][0]}, ${STARTING_SKILL_BAND[k][1]}]`)
console.log('')

// Today's distribution: what a freshly created fourteen-year-old is, over SEEDS careers.
const freshBySkill: Record<string, number[]> = {}
const freshMean: number[] = []
for (const k of SKILL_KEYS) freshBySkill[k] = []
for (let i = 0; i < SEEDS; i++) {
  const seed = `bench-fresh-${i}`
  const at14 = withHeadStart(startingSkills(seed, DEFAULT_PROFILE), DEFAULT_PROFILE.birthMonth)
  for (const k of SKILL_KEYS) freshBySkill[k].push(at14[k])
  freshMean.push(mean(SKILL_KEYS.map((k) => at14[k])))
}

const rows: Array<{ name: string; mean: number[]; bySkill: Record<string, number[]>; clamped: number }> = []
for (const p of paths) {
  const bySkill: Record<string, number[]> = {}
  for (const k of SKILL_KEYS) bySkill[k] = []
  const means: number[] = []
  let clamped = 0
  let cells = 0
  const walk = childhoodWalk(p.years)
  for (let i = 0; i < SEEDS; i++) {
    const seed = `bench-fresh-${i}`
    const born = startingSkills(seed, DEFAULT_PROFILE)
    const raised = childhoodArrival(born, p.years)
    // HOW OFTEN THE BAND GUARD BINDS – a girl already born at the top of an axis cannot be raised
    // past the top of what this game says a fourteen-year-old is, and that has a rate.
    for (const k of SKILL_KEYS) {
      cells++
      const want = born[k] + walk.level + walk.shape[k]
      if (Math.abs(want - raised[k]) > 0.005) clamped++
    }
    const at14 = withHeadStart(raised, DEFAULT_PROFILE.birthMonth)
    for (const k of SKILL_KEYS) bySkill[k].push(at14[k])
    means.push(mean(SKILL_KEYS.map((k) => at14[k])))
  }
  rows.push({ name: p.name, mean: means, bySkill, clamped: clamped / cells })
}

function report(name: string, xs: number[]): void {
  const s = [...xs].sort((a, b) => a - b)
  console.log(
    `  ${name.padEnd(12)} min ${f(s[0])}  p05 ${f(quantile(s, 0.05))}  p50 ${f(quantile(s, 0.5))}  ` +
      `p95 ${f(quantile(s, 0.95))}  max ${f(s[s.length - 1])}  mean ${f(mean(xs))}`,
  )
}

console.log(`MEAN ATTRIBUTE AT FOURTEEN (${SEEDS} seeds each):`)
report('TODAY', freshMean)
for (const r of rows) report(r.name, r.mean)

// ⚠ THE SUPPORT, NOT THE OBSERVED MINIMUM. A mean of 39.10 needs all five attributes drawn at the
// bottom of their bands at once – 1 in 3.0M, so 20000 seeds never shows it, and comparing a path's
// observed min against TODAY's observed min would call an in-band arrival an escape.
let supLo = 0
let supHi = 0
for (const k of SKILL_KEYS) {
  supLo += STARTING_SKILL_BAND[k][0]
  supHi += STARTING_SKILL_BAND[k][1]
}
supLo /= SKILL_KEYS.length
supHi /= SKILL_KEYS.length
const bump = 0.1 // the June head start `withHeadStart` adds to every row above, DEFAULT_PROFILE
console.log(`\n  the mean's SUPPORT today, from STARTING_SKILL_BAND: [${f(supLo + bump)}, ${f(supHi + bump)}]`)
for (const r of rows) {
  const lo = Math.min(...r.mean)
  const hi = Math.max(...r.mean)
  const inside = lo >= supLo + bump - 1e-9 && hi <= supHi + bump + 1e-9
  console.log(`  ${r.name.padEnd(12)} [${f(lo)}, ${f(hi)}]  ${inside ? 'INSIDE' : '!! OUTSIDE !!'}`)
}

// ⚠⚠ THE OVERLAP, AND THE FIRST VERSION OF THIS BLOCK LIED. It binned both distributions at 0.1 and
// summed the shared area – and reported the grinder at 0.0% overlap with today while its range,
// [39.58, 56.43], covers almost the whole of today's [40.10, 57.30]. Both distributions live on a
// LATTICE (a mean of five integers is a multiple of 0.2), and a path whose level is not a multiple of
// 0.2 shifts its lattice off today's, so the bins never collide and the "overlap" measures lattice
// alignment rather than distribution. What is wanted is lattice-free: where the girls actually fall.
const freshSorted = [...freshMean].sort((a, b) => a - b)
const p05 = quantile(freshSorted, 0.05)
const p95 = quantile(freshSorted, 0.95)
const lo0 = freshSorted[0]
const hi0 = freshSorted[freshSorted.length - 1]
console.log(`\nWHERE THE PROLOGUE'S GIRLS FALL AGAINST TODAY'S (today p05..p95 = ${f(p05)}..${f(p95)}, ` +
  `observed range ${f(lo0)}..${f(hi0)}):`)
for (const r of rows) {
  const inBand = r.mean.filter((x) => x >= p05 && x <= p95).length / r.mean.length
  const inRange = r.mean.filter((x) => x >= lo0 && x <= hi0).length / r.mean.length
  console.log(
    `  ${r.name.padEnd(12)} ${(inBand * 100).toFixed(1)}% inside today's central 90%   ` +
      `${(inRange * 100).toFixed(1)}% inside today's observed range`,
  )
}

console.log('\nPER-SKILL SUPPORT (min .. max over every seed and every path):')
for (const k of SKILL_KEYS) {
  const todayLo = Math.min(...freshBySkill[k])
  const todayHi = Math.max(...freshBySkill[k])
  let lo = Infinity
  let hi = -Infinity
  for (const r of rows) {
    lo = Math.min(lo, ...r.bySkill[k])
    hi = Math.max(hi, ...r.bySkill[k])
  }
  const inside = lo >= todayLo - 1e-9 && hi <= todayHi + 1e-9
  console.log(
    `  ${k.padEnd(14)} today [${f(todayLo)}, ${f(todayHi)}]   prologue [${f(lo)}, ${f(hi)}]   ${inside ? 'INSIDE' : '!! OUTSIDE !!'}`,
  )
}

console.log('\nTHE SWING THE NINE YEARS ARE WORTH (mean attribute, same seeds):')
const medianRow = rows.find((r) => r.name === 'median')!
for (const r of rows) {
  console.log(`  ${r.name.padEnd(12)} ${f(mean(r.mean) - mean(medianRow.mean), 3)} vs a median childhood`)
}
console.log(`  (CHILDHOOD.swingPoints = ${CHILDHOOD.swingPoints}, shapeSwingPoints = ${CHILDHOOD.shapeSwingPoints})`)

console.log('\nHOW OFTEN THE BAND GUARD BINDS (share of the five attributes it moved):')
for (const r of rows) console.log(`  ${r.name.padEnd(12)} ${(r.clamped * 100).toFixed(1)}%`)

console.log('\nPER-SKILL MEAN, TODAY vs THE LOPSIDED CHILDHOODS (the shape channel):')
console.log('  skill          ' + ['TODAY', ...rows.map((r) => r.name)].map((n) => n.padStart(10)).join(''))
for (const k of SKILL_KEYS) {
  console.log(
    `  ${k.padEnd(14)}` +
      [mean(freshBySkill[k]), ...rows.map((r) => mean(r.bySkill[k]))].map((v) => v.toFixed(2).padStart(10)).join(''),
  )
}

console.log('\nTHE GRINDER MUST NOT WIN – "a branch that always ends better is not a decision":')
const devoted = rows.find((r) => r.name === 'devoted')!
const grinder = rows.find((r) => r.name === 'grinder')!
console.log(`  devoted ${f(mean(devoted.mean))}   grinder ${f(mean(grinder.mean))}   ` +
  `${mean(grinder.mean) < mean(devoted.mean) ? 'OK – the grinder is worse' : '!! the grinder wins !!'}`)
