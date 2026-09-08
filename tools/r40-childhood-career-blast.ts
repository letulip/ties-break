/**
 * r40-childhood-career-blast – ROUND 40 #6, THE BLAST RADIUS OF A CHILDHOOD DIAL.
 *
 * ⚠⚠ THE REASON THIS FILE EXISTS: the arrival is not the end of the childhood's reach, it is the
 * START of twenty years of development. `growWeek` moves her against her own headroom, so a girl who
 * arrives higher has LESS room and grows more slowly – the arrival gap can widen, hold or close, and
 * which of the three it does is a measurement rather than an opinion. A childhood dial that quietly
 * moves a peak career is a balance change the owner has not approved, so the candidate is walked
 * through real careers at 18 and at her peak before it is proposed, not after.
 *
 * WHAT IS WALKED: the cheapest and the dearest of the 32 reachable runs of the shipped card table,
 * both under the shipped dials (arm A) and under the candidate (arm B), on the same seeds, through
 * `openCareer`/`stepCareerWeek`'s own shape (`tools/econ-bench.ts`, as `r40-retire-trigger.ts` and
 * `r40-age-branch.ts` walk them). Reported: the mean attribute at fourteen (the arrival), at
 * eighteen (the end of the junior window), and at her PEAK (the highest it ever reads).
 *
 * ⚠ Synthetic seeds only; the owner's saves are read-only and never fixtures.
 *
 * Run: npx vite-node tools/r40-childhood-career-blast.ts [-- --seeds 8 --share 0.8 --carry 0.6]
 */
import { CHILDHOOD, childhoodWalk } from '../src/engine/childhood'
import { createWorld, type WorldState } from '../src/engine/world'
import { SKILL_KEYS } from '../src/engine/development'
import { rngFromSeed } from '../src/engine/rng'
import { kidAgeAt } from '../src/engine/world/age'
import { stepCareerWeek } from './econ-bench'
import { EMPTY_RUN, cardFor, chosenYears, withOrigin, withPick } from '../src/prologue/run'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { PrologueRun } from '../src/prologue/run'
import type { ChildhoodYear } from '../src/engine/childhood'

const args = process.argv.slice(2)
const numArg = (flag: string, dflt: number) => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}
const nSeeds = numArg('--seeds', 8)
const CANDIDATE = { coordinationShare: numArg('--share', 0.8), habitCarry: numArg('--carry', 0.6) }
const SHIPPED = { coordinationShare: CHILDHOOD.coordinationShare, habitCarry: CHILDHOOD.habitCarry }
const PEAK_AGE = numArg('--peak-age', 30)

const PROFILE = { ...DEFAULT_PROFILE, background: 'middle' as const }

function setDials(d: { coordinationShare: number; habitCarry: number }): void {
  const w = CHILDHOOD as unknown as Record<string, number>
  w.coordinationShare = d.coordinationShare
  w.habitCarry = d.habitCarry
}

// The 32 reachable runs, walked (the twelfth's face is derived, so its answers can only be read off
// the run that reached it) – then the cheapest and the dearest by level.
const DECISION_AGES = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)
const RUNS: PrologueRun[] = (() => {
  const out: PrologueRun[] = []
  const step = (i: number, run: PrologueRun): void => {
    if (i === DECISION_AGES.length - 1) {
      for (const opt of cardFor(12, run).options ?? []) out.push(withPick(run, 12, opt.id))
      return
    }
    for (const opt of PROLOGUE_CARDS.find((c) => c.age === DECISION_AGES[i])?.options ?? []) {
      step(i + 1, withPick(run, DECISION_AGES[i], opt.id))
    }
  }
  step(0, withOrigin(EMPTY_RUN, 'middle'))
  return out
})()
const YEARS = RUNS.map((r) => chosenYears(r))
const levels = YEARS.map((y) => childhoodWalk(y).level)
const ROADS: Array<{ label: string; years: ChildhoodYear[] }> = [
  { label: 'cheapest', years: YEARS[levels.indexOf(Math.min(...levels))] },
  { label: 'dearest', years: YEARS[levels.indexOf(Math.max(...levels))] },
]

const meanOf = (s: Record<string, number>) => SKILL_KEYS.reduce((n, k) => n + s[k], 0) / SKILL_KEYS.length

type Walk = { at14: number; at18: number; peak: number; peakAge: number; ended: string | null }

function walkCareer(seed: string, years: ChildhoodYear[]): Walk {
  const world = createWorld(seed, PROFILE, `blast-${seed}`, { years: [...years], spentCents: 0 })
  const rng = rngFromSeed(world.seed)
  const at14 = meanOf(world.skills as unknown as Record<string, number>)
  let at18 = at14
  let read18 = false
  let peak = at14
  let peakAge = 14
  for (let n = 0; n < (PEAK_AGE - 14) * 52; n++) {
    stepCareerWeek(world as WorldState, rng)
    const now = meanOf((world as WorldState).skills as unknown as Record<string, number>)
    const age = kidAgeAt(world as WorldState, (world as WorldState).week)
    if (age >= 18 && !read18) {
      at18 = now
      read18 = true
    }
    if (now > peak) {
      peak = now
      peakAge = age
    }
  }
  return { at14, at18, peak, peakAge, ended: (world as WorldState).ending?.type ?? null }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const f = (n: number, d = 3) => n.toFixed(d).padStart(d + 4)

console.log(`\nCAREER BLAST RADIUS – ${nSeeds} seeds x ${ROADS.length} roads x 2 dial arms, walked to age ${PEAK_AGE}`)
console.log(`  A (shipped)   coordinationShare ${SHIPPED.coordinationShare}  habitCarry ${SHIPPED.habitCarry}`)
console.log(`  B (candidate) coordinationShare ${CANDIDATE.coordinationShare}  habitCarry ${CANDIDATE.habitCarry}\n`)

type Cell = { at14: number[]; at18: number[]; peak: number[]; peakAge: number[] }
const cells: Record<string, Cell> = {}
for (const arm of ['A', 'B'] as const) {
  setDials(arm === 'A' ? SHIPPED : CANDIDATE)
  for (const road of ROADS) {
    // ⚠ THE YEARS ARE REBUILT UNDER THE ARM'S DIALS: which run is «dearest» is itself a function of
    // the dials, and a road frozen under A would measure the wrong childhood under B.
    const ls = YEARS.map((y) => childhoodWalk(y).level)
    const years = road.label === 'cheapest' ? YEARS[ls.indexOf(Math.min(...ls))] : YEARS[ls.indexOf(Math.max(...ls))]
    const cell: Cell = { at14: [], at18: [], peak: [], peakAge: [] }
    for (let i = 0; i < nSeeds; i++) {
      const w = walkCareer(`blast-${i}`, years)
      cell.at14.push(w.at14)
      cell.at18.push(w.at18)
      cell.peak.push(w.peak)
      cell.peakAge.push(w.peakAge)
    }
    cells[`${arm}/${road.label}`] = cell
  }
}
setDials(SHIPPED)

console.log('  arm  road       at 14     at 18      peak   peak age')
for (const road of ROADS) {
  for (const arm of ['A', 'B'] as const) {
    const c = cells[`${arm}/${road.label}`]
    console.log(
      `   ${arm}   ${road.label.padEnd(9)} ${f(mean(c.at14))}  ${f(mean(c.at18))}  ${f(mean(c.peak))}   ${mean(c.peakAge).toFixed(1)}`,
    )
  }
  const a = cells[`A/${road.label}`]
  const b = cells[`B/${road.label}`]
  console.log(
    `       ${'B - A'.padEnd(9)} ${f(mean(b.at14) - mean(a.at14))}  ${f(mean(b.at18) - mean(a.at18))}  ${f(mean(b.peak) - mean(a.peak))}`,
  )
}

// ⚠ PAIRED, BECAUSE THE SEEDS ARE THE SAME IN BOTH ARMS. A mean-of-means over 12 careers carries
// several points of seed noise; the per-seed difference carries none of it, so this is the number
// that says whether the dial moved the career or the sample did.
console.log('\nPAIRED (B - A on the same seed), mean +/- standard error')
const sem = (xs: number[]) => {
  const m = mean(xs)
  const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / Math.max(1, xs.length - 1)
  return Math.sqrt(v / xs.length)
}
for (const road of ROADS) {
  const a = cells[`A/${road.label}`]
  const b = cells[`B/${road.label}`]
  const d = (key: 'at14' | 'at18' | 'peak') => a[key].map((x, i) => b[key][i] - x)
  console.log(
    `   ${road.label.padEnd(9)} at 14 ${f(mean(d('at14')))} +/- ${sem(d('at14')).toFixed(3)}` +
      `   at 18 ${f(mean(d('at18')))} +/- ${sem(d('at18')).toFixed(3)}` +
      `   at peak ${f(mean(d('peak')))} +/- ${sem(d('peak')).toFixed(3)}`,
  )
}

console.log('\nTHE SPAN THE PLAYER FEELS – dearest minus cheapest, at each of the three moments')
for (const arm of ['A', 'B'] as const) {
  const ch = cells[`${arm}/cheapest`]
  const de = cells[`${arm}/dearest`]
  console.log(
    `   ${arm}: at 14 ${f(mean(de.at14) - mean(ch.at14))}   at 18 ${f(mean(de.at18) - mean(ch.at18))}   at peak ${f(mean(de.peak) - mean(ch.peak))}`,
  )
}
